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

const handleContext = async (context: SkyWayContext, isCamera:boolean, withAudio:boolean) => {

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

    const video = await SkyWayStreamFactory.createCameraVideoStream({deviceId: cameraDevices[0].id});
    const elm = document.getElementById('video') as HTMLVideoElement;
    video.attach(elm);
    await elm.play();
    const publication = await me.publish(video);

    if (withAudio) {
      const audio = await SkyWayStreamFactory.createMicrophoneAudioStream();
      await me.publish(audio);
    }
    
    const button = document.createElement('button');
    button.id = 'camera-button';
    button.innerText = `camera: ${cameraDevices[cameraIndex].label}`;
    document.getElementById('status').appendChild(button);

    button.addEventListener('click', async () => {
      cameraIndex = (cameraIndex + 1) % cameraDevices.length;
      button.innerText = `camera: ${cameraDevices[cameraIndex].label}`;

      const video = await SkyWayStreamFactory.createCameraVideoStream({deviceId: cameraDevices[cameraIndex].id});
      const elm = document.getElementById('video') as HTMLVideoElement;
      video.attach(elm);
      await elm.play();

      await publication.replaceStream(video);
    });

    const subscribeAndAttach = async (publication) => {
      if (publication.publisher.id === me.id) return;

      const { stream } = await me.subscribe(publication.id);

      switch (stream.contentType) {
        case 'data':
          {
            stream.onData.add(async (data) => {
              const obj = JSON.parse(data as string);
              const angle:number = obj.angle;
              if(angle === undefined) return;
              console.log('set servo angle:' + angle);
              await setServoAngle(angle);

            });
          }
          break;
      }
    };

    channel.publications.forEach(subscribeAndAttach);
    channel.onStreamPublished.add((e) => subscribeAndAttach(e.publication));



  } else { //viewer

    const data = await SkyWayStreamFactory.createDataStream();
    await me.publish(data);

    const subscribeAndAttach = async (publication) => {
      if (publication.publisher.id === me.id) return;

      const { stream } = await me.subscribe(publication.id);

      switch (stream.contentType) {
        case 'video':
          {
            const elm = document.getElementById('video') as HTMLVideoElement;
            stream.attach(elm);
            document.getElementById('status').innerHTML =
              '<button>left</button><div>angle: 50%</div><button>right</button>';

            const leftButton = document.createElement('button');
            leftButton.innerText = 'left';

            const span = document.createElement('span');
            span.innerText = ` angle: ${servoAngle}% `;
            span.id = 'angle';

            const rightButton = document.createElement('button');
            rightButton.innerText = 'right';

            document.getElementById('status').innerHTML = '';
            document.getElementById('status').appendChild(leftButton);
            document.getElementById('status').appendChild(span);
            document.getElementById('status').appendChild(rightButton);
        
            leftButton.addEventListener('click', async () => {
              servoAngle = Math.max(0, servoAngle - 10);
              document.getElementById('angle').innerText = ` angle: ${servoAngle}% `;
              data.write(JSON.stringify({angle: servoAngle}));
            });

            rightButton.addEventListener('click', async () => {
              servoAngle = Math.min(100, servoAngle + 10);
              document.getElementById('angle').innerText = ` angle: ${servoAngle}% `;
              data.write(JSON.stringify({angle: servoAngle}));
            });

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


const addErrorHandler = (context:SkyWayContext, token:string, isCamera:boolean, withAudio:boolean) => {
  context.onFatalError.add(async () => {
    context.dispose();

    const newContext = await createContext(token, true);
    handleContext(newContext, isCamera, withAudio);
    addErrorHandler(newContext, token, isCamera, withAudio);
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

const getServoAngle = async ():Promise<number> => {
  return await fetch('/servo')
    .then(response => response.json())
    .then(data => {
      return data.angle;
    });
};

const setServoAngle =async (angle:number) => {
  await fetch('/servo', {
		method: 'post',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({angle:angle})
	})
}

let servoAngle = 50;

(async () => {

  servoAngle = await getServoAngle();
  console.log('current servo angle: ' + servoAngle);

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

  const withAudio =
    new URLSearchParams(window.location.search).get('audio') === 'true';

  const token = makeAuthToken(appId, secret);
  const context = await createContext(token, false);
  handleContext(context, isCamera, withAudio);
  addErrorHandler(context, token, isCamera, withAudio);

})();
