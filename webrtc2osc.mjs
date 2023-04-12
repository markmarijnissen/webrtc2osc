import debug from "debug";
import OSC from "osc-js";
import peerjs from 'peerjs';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import WebRTC from '@koush/wrtc';
import FileReader from 'filereader';

const { Peer } = peerjs;
const log = debug('webrtc2osc');
const polyfills = { fetch, WebSocket, WebRTC, FileReader };

export default function webrtc2osc({ peerId, host = 'localhost', send = 11000, receive = 11001 }) {
    log({
        peerId,
        host,
        send,
        receive,
    })
    
    const peerConnections = {};
    const peer = new Peer(peerId, { polyfills });
    const osc = new OSC({
        plugin: new OSC.DatagramPlugin({
            open: {
                host,
                port: receive
            },
            send: {
                host,
                port: send
            }
        })
    });
    peer.on('open', id => {
        log('open', id);
    });
    peer.on('connection', conn => {
        conn.on('open', () => {
            log('peer connected', conn.peer);
            peerConnections[conn.peer] = conn;
        });
        conn.on('close', () => {
            log('peer disconnected', conn.peer);
            delete peerConnections[conn.peer];
        });
        conn.on('error', err => {
            console.error('peer connection error', err);
            delete peerConnections[conn.peer];
        });
        conn.on('data', data => {
            log('peer>osc', ...data);
            osc.send(new OSC.Message(...data));
        });
    })
    osc.on('/*', (msg) => {
        Object.values(peerConnections).forEach(conn => {
            log('osc>peer', msg.address, ...msg.args);
            conn.send([msg.address, ...msg.args]);
        });
    })
    osc.on('error', err => {
        log('osc error', err);
    })
    osc.open();
}