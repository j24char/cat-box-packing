/**
 * Firebase configuration for Cat Box Packing.
 *
 * The canonical Firebase settings are stored in `GoogleService-Info.plist`
 * at the project root — the file Firebase's iOS/Android SDKs read at app
 * startup. React Native apps cannot read arbitrary files at runtime, so this
 * module embeds a copy of that plist and parses out the keys used by the
 * analytics layer.
 *
 * ► KEEP THE EMBEDDED PLIST IN SYNC WITH <repoRoot>/GoogleService-Info.plist ◄
 */

export interface FirebaseConfig {
  /** Web API key used to call Firebase REST endpoints (Identity Toolkit, Firestore). */
  apiKey: string;
  /** Firebase project id, e.g. `catboxpacking`. */
  projectId: string;
  /** Firebase Cloud Messaging sender id. */
  gcmSenderId: string | null;
  /** Reverse-DNS bundle / app id. */
  bundleId: string | null;
  /** Default Cloud Storage bucket. */
  storageBucket: string | null;
  /** Google / iOS app id. */
  googleAppId: string | null;
  /** Whether Firebase's built-in usage analytics is enabled. */
  analyticsEnabled: boolean;
}

export const GOOGLE_SERVICE_INFO_PLIST: string = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>API_KEY</key>
	<string>AIzaSyDdTbd1DV7kUIj_uuCyjA7s32pwGzSKZUM</string>
	<key>GCM_SENDER_ID</key>
	<string>770686235964</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.j24char.catboxpacking</string>
	<key>PROJECT_ID</key>
	<string>catboxpacking</string>
	<key>STORAGE_BUCKET</key>
	<string>catboxpacking.firebasestorage.app</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>1:770686235964:ios:818a64534a9c30e05e9a39</string>
</dict>
</plist>`;

/** Matches `<key>NAME</key> <string>VALUE</string>` and `<true/>`/`<false/>` boolean entries. */
const plistEntryRegex = /<key>([^<]*)<\/key>\s*<(string|true|false)>([^<]*)<\/(?:string|true|false)>/gi;

export const parsePlistConfig = (xml: string): FirebaseConfig => {
  const raw: Record<string, string | boolean> = {};
  let match: RegExpExecArray | null;
  while ((match = plistEntryRegex.exec(xml)) !== null) {
    const key = match[1];
    const kind = match[2];
    const value = match[3];
    raw[key] = kind === 'string' ? value : kind === 'true';
  }

  const str = (key: string): string | null => {
    const value = raw[key];
    return typeof value === 'string' ? value : null;
  };

  return {
    apiKey: str('API_KEY') ?? '',
    projectId: str('PROJECT_ID') ?? '',
    gcmSenderId: str('GCM_SENDER_ID'),
    bundleId: str('BUNDLE_ID'),
    storageBucket: str('STORAGE_BUCKET'),
    googleAppId: str('GOOGLE_APP_ID'),
    analyticsEnabled: raw['IS_ANALYTICS_ENABLED'] === true,
  };
};

export const FIREBASE_CONFIG: FirebaseConfig = parsePlistConfig(GOOGLE_SERVICE_INFO_PLIST);