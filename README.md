# Wilma Plus Web Backend
Wilma Plus Web's backend for communicating with Wilma API

## Run backend
**NOTE!** To run this backend, you need Wilma's API key. To obtain one, pleae email directly to Visma.

1. Copy file `config/config.json.example` to `config.json` and insert your Wilma API Key to `wilma_apikey`. If you wish to add a backup key, set its value to key `reserve_api_key`. To use reserve key instead of main, change `use_reserve` to `true`.

2. Create server list cache with command `npm run cache-server`

3. Start webserver with command `npm run server`, which should start an http server on default port 3000. (Set your custom port with env variable `PORT`).
