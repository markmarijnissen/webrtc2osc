#!/usr/bin/env node
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import webrtc2osc from "./webrtc2osc.mjs";
import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import address from "address";
import qr from "qrcode-terminal";
import debug from "debug";

debug.enable('webrtc2osc');
const log = debug('webrtc2osc');
const argv = yargs(hideBin(process.argv)).argv || {};
const confFile = path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], 'webrtc2osc.json');
const confFileExists = await fs.access(confFile).then(() => true, () => false);
const config = confFileExists ? JSON.parse(await fs.readFile(confFile)) : {};

const defaultConfig = {
    peerId: uuid(),
    url: null,
    host: 'localhost',
    send: 11000,
    receive: 11001
};

Object.entries(defaultConfig)
    .forEach(([key, defaultValue]) => {
        if (argv[key]) config[key] = argv[key];
        if (!config[key]) config[key] = defaultValue;
    });

if (Object.keys(argv).length > 2 || !confFileExists) {
    log(`Saving settings in ${confFile}`);
    await fs.writeFile(confFile, JSON.stringify(config, null, 4));
} else if (!confFileExists) {
    log('Using default settings.')
    log('Use --peer-id, --host, --send, --receive to change defaults.');
} else {
    log(`Loaded settings from ${confFile}`);
}
if (typeof config.url === 'string' && config.url.length > 0) {
    config.url = config.url.replace("{peerId}", config.peerId).replace("{ip}", address.ip());
    console.log(config.url);
    if (argv.qr) {
        qr.generate(config.url);
    }
}

webrtc2osc(config);