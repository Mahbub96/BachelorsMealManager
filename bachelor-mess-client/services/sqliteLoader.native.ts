// This file is only used on native platforms (iOS/Android)
// Metro will use this file instead of sqliteLoader.ts on native platforms
// On web, this file is never loaded, so expo-sqlite is never resolved

import * as SQLite from 'expo-sqlite';

export default SQLite;
