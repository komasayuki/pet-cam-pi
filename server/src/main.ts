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

const setServoAngleByPercentage = (anglePercentage:number) => {
    const pulseWidth = ~~(PulseWidthMin + (PulseWidthMax - PulseWidthMin) * anglePercentage / 100);
    console.log('set servo angle: ' + anglePercentage + ' pulse width: ' + pulseWidth);
    motor.servoWrite(pulseWidth);
};


let currentAngle = 50;
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
    currentAngle = Math.max(0, Math.min(100, anglePercentage));
    setServoAngleByPercentage(currentAngle);
    
    res.status(200).send('ok');
});