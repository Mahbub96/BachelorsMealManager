# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Fix for ReactStylesDiffMap.backingMap NoSuchFieldException on Android 12+
# This is required for Expo Kotlin view wrappers to access ReactStylesDiffMap via reflection
# Keep the entire class and ALL its members (including private fields) to prevent obfuscation
# The *; keeps all members (fields, methods, constructors) accessible for reflection
-keep class com.facebook.react.uimanager.ReactStylesDiffMap {
    *;
}

# Keep Expo modules Kotlin classes
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# Keep React Native classes that use reflection
-keep class com.facebook.react.uimanager.** { *; }
-dontwarn com.facebook.react.uimanager.**

# Add any project specific keep options here:
