import { handle } from '../../server/payment.js';
export const onRequest = ({request,env}) => handle(request,env);
