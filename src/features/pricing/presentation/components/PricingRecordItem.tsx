import React, { memo, useEffect, useState } from 'react';
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type {
  PricingRecord,
  PricingUpdateFields,
} from '../../domain/PricingTypes';

type DraftState = {
  storeId: string;
  sku: string;
  productName: string;
  price: string;
  date: string;
};

type Props = {
  item: PricingRecord;
  isEditing: boolean;
  saving: boolean;
  onStartEdit: (record: PricingRecord) => void;
  onCancelEdit: () => void;
  onSave: (id: number, fields: PricingUpdateFields) => void;
};

function PricingRecordItem({
  item,
  isEditing,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<DraftState>({
    storeId: item.storeId,
    sku: item.sku,
    productName: item.productName,
    price: String(item.price),
    date: item.date,
  });

  useEffect(() => {
    if (isEditing) {
      setDraft({
        storeId: item.storeId,
        sku: item.sku,
        productName: item.productName,
        price: String(item.price),
        date: item.date,
      });
    }
  }, [isEditing, item]);

  function updateDraft(key: keyof DraftState, value: string) {
    setDraft(current => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSave() {
    const price = Number(draft.price);

    if (
      !draft.storeId.trim() ||
      !draft.sku.trim() ||
      !draft.productName.trim() ||
      !draft.date.trim()
    ) {
      Alert.alert('Invalid data', 'Please fill all fields');
      return;
    }

    if (Number.isNaN(price)) {
      Alert.alert('Invalid price', 'Please enter a valid price');
      return;
    }

    onSave(item.id, {
      storeId: draft.storeId.trim(),
      sku: draft.sku.trim(),
      productName: draft.productName.trim(),
      price,
      date: draft.date.trim(),
    });
  }

  return (
    <View
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#ddd',
      }}
    >
      {isEditing ? (
        <>
          <Text>Store ID</Text>
          <TextInput
            value={draft.storeId}
            onChangeText={value => updateDraft('storeId', value)}
            style={inputStyle}
          />

          <Text>SKU</Text>
          <TextInput
            value={draft.sku}
            onChangeText={value => updateDraft('sku', value)}
            style={inputStyle}
          />

          <Text>Product Name</Text>
          <TextInput
            value={draft.productName}
            onChangeText={value => updateDraft('productName', value)}
            style={inputStyle}
          />

          <Text>Price</Text>
          <TextInput
            value={draft.price}
            onChangeText={value => updateDraft('price', value)}
            keyboardType="decimal-pad"
            style={inputStyle}
          />

          <Text>Date</Text>
          <TextInput
            value={draft.date}
            onChangeText={value => updateDraft('date', value)}
            placeholder="2026-01-01"
            style={inputStyle}
          />

          <TouchableOpacity
            disabled={saving}
            onPress={handleSave}
            style={buttonStyle}
          >
            <Text style={buttonTextStyle}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={saving}
            onPress={onCancelEdit}
            style={{
              ...buttonStyle,
              backgroundColor: '#777',
            }}
          >
            <Text style={buttonTextStyle}>Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text>Store: {item.storeId}</Text>
          <Text>SKU: {item.sku}</Text>
          <Text>Product: {item.productName}</Text>
          <Text>Price: {item.price}</Text>
          <Text>Date: {item.date}</Text>

          <TouchableOpacity
            onPress={() => onStartEdit(item)}
            style={buttonStyle}
          >
            <Text style={buttonTextStyle}>Edit</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#999',
  padding: 8,
  marginTop: 4,
  marginBottom: 8,
  borderRadius: 6,
};

const buttonStyle = {
  backgroundColor: '#222',
  padding: 10,
  marginTop: 8,
  borderRadius: 6,
};

const buttonTextStyle = {
  color: 'white',
  textAlign: 'center' as const,
};

export default memo(PricingRecordItem);
