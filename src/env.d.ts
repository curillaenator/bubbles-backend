declare namespace NodeJS {
  interface ProcessEnv {
    BOT_TOKEN: string;
    FIREBASE_RTDB_URL: string;
    WEB_APP_ORIGIN: string;
    TG_BOTNAME: string;
    PORT?: string;
  }
}
