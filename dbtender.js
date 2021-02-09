'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV;
const config = require(__dirname + '/database/config/config.json')[env];
const {exec} = require('child_process');

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

async function start() {
    await new Promise((resolve, reject) => {
        const create = exec(
            'npx sequelize-cli db:create || npx sequelize-cli db:migrate',
            //{env: `${env}`},
            (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );

        // Forward stdout+stderr to this process
        //migrate.stderr.pipe(process.stderr);

        create.stdout.on('data', (data) => {
          if (data.indexOf('No migrations were executed, database schema was already up to date.') !== -1) {
            console.log(`DBTENDER: Created DB.`);
            create.kill();
          }
        });

    });
}

module.exports = {
    start: start
};
