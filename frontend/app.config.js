module.exports = {
  expo: {
    name: "Aspirant Arcade",
    slug: "aspirant-arcade",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "aspirantarcade",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0E17",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.aspirantarcade.app",
    },
    android: {
      versionCode: 2,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0E17",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.aspirants.arcade",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      permissions: ["android.permission.REQUEST_INSTALL_PACKAGES"],
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-font",
      "@react-native-google-signin/google-signin",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "7f7ad0b6-83f8-41a1-8eec-cfface44b3d2",
      },
    },
  },
};
