import { Achievement } from './game';

export const ACH_SWIM = 'swim';
export const ACH_GRAB = 'grab';
export const ACH_GRAB2 = 'grab2';

export const CORE_ACHIEVEMENTS = [{
    id: ACH_SWIM,
    image: require('./images/ach-swim.png'),
    label: `The water's fine`,
    description: 'Go for a swim.',
}, {
    id: ACH_GRAB,
    image: require('./images/ach-grab.png'),
    label: `This is mine now`,
    description: 'Grab an object.',
}, {
    id: ACH_GRAB2,
    image: require('./images/ach-grab2.png'),
    label: `Grabby grabby`,
    description: 'Hold two objects.',
}];
