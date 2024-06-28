import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDdA0Y1opOTB8aRCdEDHqapdKDU1ft5CkM",
  authDomain: "alcademy-assist-3fce2.firebaseapp.com",
  projectId: "alcademy-assist-3fce2",
  storageBucket: "alcademy-assist-3fce2.appspot.com",
  messagingSenderId: "185963385145",
  appId: "1:185963385145:web:0712599899d7c727f558e8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// WebClientId= 185963385145-or5p5ssmd5brp1e6377ms8dcilmhrn6n.apps.googleusercontent.com
// androidClientId= 185963385145-df3d0av2bs6nooimd6dn7bb4ifmdmab6.apps.googleusercontent.com
// SH1 FigurePrint= 73:20:E5:0E:5F:48:BE:49:0D:A1:09:AB:3E:3F:D2:2C:67:3E:B7:B6
