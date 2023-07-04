import {
  nowInSec,
  SkyWayAuthToken,
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory,
  uuidV4,
} from '@skyway-sdk/room';



const createContext = async (token:string, persistent:boolean):Promise<SkyWayContext> => {

  let retryCount = 0;
  while(true){
    try {
      return await SkyWayContext.Create(token);
    }
    catch (e) {
      document.getElementById('status').innerText = 'Connecting SkyWay failed. Check console logs.';

      if (persistent) {
        retryCount++;
        const waitMilliSeconds = 1000 * Math.min(60, retryCount * 5);
        await new Promise(resolve => setTimeout(resolve, waitMilliSeconds))
        continue;
      }

      throw e;
    }
  }
};


let cameraIndex = 0;

const handleContext = async (context: SkyWayContext, isCamera:boolean) => {

  const channel = await SkyWayRoom.FindOrCreate(context, {
    type: 'p2p',
    name: 'my-lovely-pets',
  });
  const me = await channel.join();

  if (isCamera) {

    const cameraDevices = await SkyWayStreamFactory.enumerateInputVideoDevices();
    if (cameraDevices.length === 0) {
      document.getElementById('status').innerText = 'No camera available.';
      return;
    }

    const videoConfig = { deviceId: cameraDevices[0].id, height: 1280, width: 720, frameRate: 15 };

    const { audio, video } =
      await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream({
        video: videoConfig,
      });
    const elm = document.getElementById('video') as HTMLVideoElement;
    video.attach(elm);
    await elm.play();

    await me.publish(audio);
    const publication = await me.publish(video);

    const button = document.createElement('button');
    button.id = 'camera-button';
    button.innerText = `camera: ${cameraDevices[cameraIndex].label}`;
    document.getElementById('status').appendChild(button);

    button.addEventListener('click', async () => {
      cameraIndex = (cameraIndex + 1) % cameraDevices.length;
      videoConfig.deviceId = cameraDevices[cameraIndex].id;
      button.innerText = `camera: ${cameraDevices[cameraIndex].label}`;

      const video = await SkyWayStreamFactory.createCameraVideoStream(videoConfig);
      const elm = document.getElementById('video') as HTMLVideoElement;
      video.attach(elm);
      await elm.play();

      await publication.replaceStream(video);
    });

  } else {
    const subscribeAndAttach = async (publication) => {
      if (publication.publisher.id === me.id) return;

      const { stream } = await me.subscribe(publication.id);

      switch (stream.contentType) {
        case 'video':
          {
            const elm = document.getElementById('video') as HTMLVideoElement;
            stream.attach(elm);
            document.getElementById('status').innerText =
              'Your lovely pet here!';
          }
          break;
        case 'audio':
          {
            const elm = document.getElementById('audio') as HTMLAudioElement;
            elm.style.display = 'block';
            stream.attach(elm);
          }
          break;
      }
    };

    channel.publications.forEach(subscribeAndAttach);
    channel.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
  }
};




const addErrorHandler = (context:SkyWayContext, token:string, isCamera:boolean) => {
  context.onFatalError.add(async () => {
    context.dispose();

    const newContext = await createContext(token, true);
    handleContext(newContext, isCamera);
    addErrorHandler(newContext, token, isCamera);
  });
}

const makeAuthToken = (appId:string, secret:string):string => {
  return new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24,
    scope: {
      app: {
        id: appId,
        turn: true,
        actions: ['read'],
        channels: [
          {
            id: '*',
            name: '*',
            actions: ['write'],
            members: [
              {
                id: '*',
                name: '*',
                actions: ['write'],
                publication: {
                  actions: ['write'],
                },
                subscription: {
                  actions: ['write'],
                },
              },
            ],
            sfuBots: [
              {
                actions: ['write'],
                forwardings: [
                  {
                    actions: ['write'],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  }).encode(secret);
}


(async () => {

  let appId = new URLSearchParams(window.location.search).get('appId');
  let secret = new URLSearchParams(window.location.search).get('secret');

  if (!appId) {
    appId = prompt('Input application ID.');
  }

  if (!secret) {
    secret = prompt('Input secret.');
  }

  const isCamera =
    new URLSearchParams(window.location.search).get('camera') === 'true';

  const token = makeAuthToken(appId, secret);
  const context = await createContext(token, false);
  handleContext(context, isCamera);
  addErrorHandler(context, token, isCamera);

})();
