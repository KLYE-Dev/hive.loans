const dotenv = require('dotenv');
dotenv.config();

   const config = {
      version: process.env.VERSION,
      nodeenv: process.env.NODE_ENV,
      debug: process.env.DEBUG,
      verbose: process.env.VERBOSE,
      dbSetup: process.env.DB_SETUP,
      mariaDb: process.env.MARIADB,
      dbPort: process.env.DB_PORT,
      dbUser: process.env.USER,
      dBpass: process.env.PASS,
      port: process.env.PORT,
      appName: process.env.SITE_ACCOUNT,
      hotwallet: process.env.HOT_WALLET,
      coldwallet: process.env.COLD_WALLET,
      demo: process.env.SITE_DEMO,
      cfdspread: process.env.CFD_SPREAD,
      sidechainId: process.env.SIDECHAIN_ID,
      bankwif: process.env.ACTIVE_PRIVKEY,
      wif: process.env.POSTING_PRIVKEY,
      secret: process.env.SESSION_SECRET,
      sechash: process.env.SECHASH,
      owner: process.env.OWNER_ACCOUNT,
      votemirror: process.env.VOTE_MIRROR,
      refunds: process.env.REFUNDS,
      stdoutblocks: process.env.STDOUT_BLOCKS,
      cmcapikey: process.env.CMC_API_KEY,
      worldcoinkey:process.env.WORLD_COIN_API_KEY,
      binanceapikey:process.env.BINANCE_API_KEY,
      binanceapisec:process.env.BINANCE_API_SEC,
    };

exports.config = config;
