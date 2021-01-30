import { Achievement } from './game';

export const ACH_SWIM = 'swim';
export const ACH_GRAB = 'grab';
export const ACH_GRAB2 = 'grab2';

import IMG_SWIM from './images/ach-swim.png';
import IMG_GRAB from './images/ach-grab.png';
import IMG_GRAB2 from './images/ach-grab2.png';

export const CORE_ACHIEVEMENTS = [{
    id: ACH_SWIM,
    image: IMG_SWIM,
    label: `The water's fine`,
    description: 'Go for a swim.',
}, {
    id: ACH_GRAB,
    image: IMG_GRAB,
    label: `This is mine now`,
    description: 'Grab an object.',
}, {
    id: ACH_GRAB2,
    image: IMG_GRAB2,
    label: `Grabby grabby`,
    description: 'Hold two objects.',
}];
