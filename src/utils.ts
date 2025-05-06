import type { TgChatMeta } from "./interfaces";

const getOrderMessage = (
  chatMeta: TgChatMeta,
  application: string
) => `Новый заказ!!!  
ник в TG: @${chatMeta.username},
полное имя: ${chatMeta.first_name} ${chatMeta.last_name},
заказ на: ${application}`;

const getReplyMessage = (
  telegram: string
) => `Я получил вашу заявку и скоро свяжусь с вами
I've recieved your application and will contact you soon    
${telegram}`;

export { getOrderMessage, getReplyMessage };
