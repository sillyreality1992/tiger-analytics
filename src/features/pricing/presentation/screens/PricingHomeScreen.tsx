import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as DocumentPicker from 'expo-document-picker';

import { addImportProgressListener } from '../../../../../modules/price-feed-native';

import type {
  PricingRecord,
  PricingSearchFilters,
  PricingUpdateFields,
} from '../../domain/PricingTypes';

import { pricingNativeRepository } from '../../data/PricingNativeRepository';
import { importPricingFeed } from '../../domain/useCases/importPricingFeed';
import { searchPricingRecords } from '../../domain/useCases/searchPricingRecords';
import { updatePricingRecord } from '../../domain/useCases/updatePricingRecord';

import PricingRecordItem from '../components/PricingRecordItem';

export default function PricingHomeScreen() {
  const [loading, setLoading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [records, setRecords] = useState<PricingRecord[]>([]);

  const pickingRef = useRef(false);

  const [storeId, setStoreId] = useState('');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const usecases = useMemo(() => {
    return {
      importFeed: importPricingFeed(pricingNativeRepository),
      searchRecords: searchPricingRecords(pricingNativeRepository),
      updateRecord: updatePricingRecord(pricingNativeRepository),
    };
  }, []);

  const loadRecords = useCallback(async () => {
    const result = await usecases.searchRecords({
      limit: 50,
      offset: 0,
    });

    setRecords(result);
  }, [usecases]);

  useEffect(() => {
    async function init() {
      try {
        await pricingNativeRepository.setupDatabase();
        await loadRecords();
      } catch (error) {
        console.log('Database setup error:', error);
      }
    }

    init();

    const subscription = addImportProgressListener(event => {
      setImportProgress(
        `Imported: ${event.imported}, Failed: ${event.failed}`
      );
    });

    return () => {
      subscription.remove();
    };
  }, [loadRecords]);

  async function handlePickCsv() {
    if (pickingRef.current || isPicking || loading) {
      return;
    }

    pickingRef.current = true;
    setIsPicking(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      setIsPicking(false);

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0]?.uri;

      if (!fileUri) {
        setErrorMessage('CSV file was not selected');
        return;
      }

      setLoading(true);
      setImportProgress('Starting import...');

      const importResult = await usecases.importFeed(fileUri);

      await loadRecords();

      setStatusMessage(
        `Import completed. Imported: ${importResult.imported}, Failed: ${importResult.failed}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.log('CSV import error:', error);

      if (message.includes('Different document picking in progress')) {
        setErrorMessage(
          'Document picker is already open. Please close it and try again.'
        );
      } else {
        setErrorMessage('CSV import failed');
      }
    } finally {
      pickingRef.current = false;
      setIsPicking(false);
      setLoading(false);
    }
  }

  function getNumberFilter(value: string, label: string) {
    if (!value.trim()) {
      return undefined;
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      Alert.alert('Invalid filter', `${label} should be a number`);
      return null;
    }

    return numberValue;
  }

  async function handleSearch() {
    const min = getNumberFilter(priceMin, 'Minimum price');
    const max = getNumberFilter(priceMax, 'Maximum price');

    if (min === null || max === null) {
      return;
    }

    const filters: PricingSearchFilters = {
      storeId: storeId.trim() || undefined,
      sku: sku.trim() || undefined,
      productName: productName.trim() || undefined,
      priceMin: min,
      priceMax: max,
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
      limit: 50,
      offset: 0,
    };

    setLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const result = await usecases.searchRecords(filters);
      setRecords(result);
      setStatusMessage(`Found ${result.length} records`);
    } catch (error) {
      console.log('Search error:', error);
      setErrorMessage('Search failed');
    } finally {
      setLoading(false);
    }
  }

  const handleStartEdit = useCallback((record: PricingRecord) => {
    setEditingId(record.id);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleSave = useCallback(
    async (id: number, fields: PricingUpdateFields) => {
      setSavingId(id);
      setErrorMessage('');
      setStatusMessage('');

      try {
        const result = await usecases.updateRecord(id, fields);

        if (result.updated) {
          setRecords(currentRecords =>
            currentRecords.map(item =>
              item.id === id
                ? {
                    ...item,
                    ...fields,
                  }
                : item
            )
          );

          setEditingId(null);
          setStatusMessage('Record updated');
        } else {
          setErrorMessage('No record was updated');
        }
      } catch (error) {
        console.log('Update error:', error);
        setErrorMessage(
          'Could not save this record. Check duplicate Store ID + SKU + Date.'
        );
      } finally {
        setSavingId(null);
      }
    },
    [usecases]
  );

  const renderItem = useCallback(
    ({ item }: { item: PricingRecord }) => {
      return (
        <PricingRecordItem
          item={item}
          isEditing={editingId === item.id}
          saving={savingId === item.id}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
        />
      );
    },
    [
      editingId,
      savingId,
      handleStartEdit,
      handleCancelEdit,
      handleSave,
    ]
  );

  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 60 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 16 }}>
        Retail Pricing Feed
      </Text>

      <Button
        title={isPicking ? 'Opening picker...' : loading ? 'Please wait...' : 'Upload CSV'}
        disabled={isPicking || loading}
        onPress={handlePickCsv}
      />

      {importProgress ? (
        <Text style={{ marginTop: 10 }}>{importProgress}</Text>
      ) : null}

      {statusMessage ? (
        <Text style={{ marginTop: 10, color: 'green' }}>
          {statusMessage}
        </Text>
      ) : null}

      {errorMessage ? (
        <Text style={{ marginTop: 10, color: 'red' }}>
          {errorMessage}
        </Text>
      ) : null}

      <View style={{ marginTop: 20 }}>
        <TextInput
          placeholder="Store ID"
          value={storeId}
          onChangeText={setStoreId}
          style={inputStyle}
        />

        <TextInput
          placeholder="SKU"
          value={sku}
          onChangeText={setSku}
          style={inputStyle}
        />

        <TextInput
          placeholder="Product Name"
          value={productName}
          onChangeText={setProductName}
          style={inputStyle}
        />

        <TextInput
          placeholder="Min Price"
          value={priceMin}
          onChangeText={setPriceMin}
          keyboardType="decimal-pad"
          style={inputStyle}
        />

        <TextInput
          placeholder="Max Price"
          value={priceMax}
          onChangeText={setPriceMax}
          keyboardType="decimal-pad"
          style={inputStyle}
        />

        <TextInput
          placeholder="Date From: 2026-01-01"
          value={dateFrom}
          onChangeText={setDateFrom}
          style={inputStyle}
        />

        <TextInput
          placeholder="Date To: 2026-12-31"
          value={dateTo}
          onChangeText={setDateTo}
          style={inputStyle}
        />

        <Button title="Search" onPress={handleSearch} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : null}

      <FlatList
        data={records}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 10,
  marginBottom: 10,
  borderRadius: 6,
};
