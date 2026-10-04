import 'dotenv/config';
import ImageKit from 'imagekit';

<<<<<<< HEAD
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export default imagekit;
=======
// The ImageKit SDK throws during construction when its keys are missing, and
// this module is imported (via the message routes) from server.js — so an
// unconfigured ImageKit used to bring the entire server down at boot, even
// though storing chat photos is optional.
//
// Built on first use instead, and only when it's actually configured.
let client = null;

export const isImageKitConfigured = () =>
    Boolean(
        process.env.IMAGEKIT_PUBLIC_KEY &&
        process.env.IMAGEKIT_PRIVATE_KEY &&
        process.env.IMAGEKIT_URL_ENDPOINT
    );

const getImageKit = () => {
    if (!isImageKitConfigured()) return null;
    if (!client) {
        client = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        });
    }
    return client;
};

export default getImageKit;
>>>>>>> 38200b2106e25bb8260288b0e2f0e163f864de65
