# Internet Pet Camera using SkyWay

The world's easiest pet camera that can be viewed from the Internet.

[日本語の説明もあります](https://qiita.com/komasayuki/items/1caef300977efa5d5981)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for testing.

### Prerequisites

A SkyWay account is required.
You can [create an account](https://console.skyway.ntt.com/signup/) for free.

Software

- [node, npm](https://nodejs.org/en/download)
- [npx](https://github.com/npm/npx)
- [http-server](https://github.com/http-party/http-server)

### Create SkyWay project and application

- [Login SkyWay](https://console.skyway.ntt.com/login/)
- Create Project
- Create Application
- Keep the displayed `Application ID` and `Secret`

### Build

```bash
% git clone https://github.com/komasayuki/pet-cam
% cd pet-cam

% npm install

% npm run build
# index.html and javascript in ./dist
```


### Run web server and open

```bash
% npx http-server ./dist
Available on:
  http://127.0.0.1:8080
```

Web server is launched on port 8080.

As a pet camera, Open [http://127.0.0.1:8080/index.html?camera=true](http://127.0.0.1:8080/index.html?camera=true)

As a viewer, Open [http://127.0.0.1:8080/index.html?camera=false](http://127.0.0.1:8080/index.html?camera=false)

When you open the web page, you will be asked for the application id and secret.
Please enter the ones you obtained from SkyWay.


## Note

WebRTC is only available on iOS devices from pages hosted over https.
This repository was made from [SkyWay's p2p room example](https://github.com/skyway/js-sdk/tree/main/examples/p2p-room).