import {Gpio} from 'pigpio';

import express, { json } from 'express';
import helmet from 'helmet';

const PORT = 8080;

const app = express();
app.use(json());
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

app.use('/', express.static('public'));
app.listen(PORT, function () {
    console.log('Listening port ' + PORT + '...');
})


const motor = new Gpio(18, {mode: Gpio.OUTPUT});

const PulseWidthMax = 2500;
const PulseWidthMin = 500;

const makePulseWidth = (anglePercentage:number):number => {
    return ~~(PulseWidthMin + (PulseWidthMax - PulseWidthMin) * (100-anglePercentage) / 100);
};

let currentAngle = 40;
let targetAngle = 50;
const setServoAngleByPercentage = (anglePercentage:number) => {
    console.log('set servo angle target: ' + anglePercentage);
    targetAngle = anglePercentage;
    tweenAngle();
};

const tweenAngle = () => {

    const diff = targetAngle - currentAngle;

    if (Math.abs(diff) < 1) {
        console.log('servo angle reached: ' + currentAngle);
        return;
    }

    if (diff > 0) {
        currentAngle += 1;
    }
    else{
        currentAngle -= 1;
    }

    const pulseWidth = makePulseWidth(currentAngle);
    motor.servoWrite(pulseWidth);

    setTimeout(tweenAngle, 100);
};



setServoAngleByPercentage(currentAngle);

app.get('/servo', async (req, res) => {
    res.status(200).send({angle: currentAngle});
});

app.post('/servo', async (req, res) => {

    let anglePercentage:number = req.body.angle;

    if (anglePercentage === undefined) {
        res.status(400).send('angle is undefined');
        return;
    }
    anglePercentage = Math.max(0, Math.min(100, anglePercentage));
    setServoAngleByPercentage(anglePercentage);
    
    res.status(200).send('ok');
});