const dotenv = require('dotenv');
dotenv.config();

   const config = {
      version: process.env.VERSION,
      nodeenv: process.env.NODE_ENV,
      debug: process.env.DEBUG,
      dbSetup: process.env.DB_SETUP,
      mariaDb: process.env.MARIADB,
      dbPort: process.env.DB_PORT,
      dbUser: process.env.USER,
      dBpass: process.env.PASS,
      port: process.env.PORT,
      appName: process.env.SITE_ACCOUNT,
      demo: process.env.SITE_DEMO,
      sidechainId: process.env.SIDECHAIN_ID,
      bankwif: process.env.ACTIVE_PRIVKEY,
      wif: process.env.POSTING_PRIVKEY,
      secret: process.env.SESSION_SECRET,
      sechash: process.env.SECHASH,
      owner: process.env.OWNER_ACCOUNT,
      votemirror: process.env.VOTE_MIRROR,
      refunds: process.env.REFUNDS,
      stdoutblocks: process.env.STDOUT_BLOCKS,
      cmcapikey: process.env.CMC_API_KEY
    };

exports.config = config;
