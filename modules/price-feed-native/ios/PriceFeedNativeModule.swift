import ExpoModulesCore

public class PriceFeedNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PriceFeedNative")

    Events("onChange")

    AsyncFunction("setValueAsync") { (value: String) in
      self.sendEvent("onChange", [
        "value": value
      ])
    }
  }
}
