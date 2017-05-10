const R = Math.random;
const D = () => (R()*16|0).toString(16); // 0-f
const B = () => (R()*16|0&0x3|0x8).toString(16); // 8-b
const UUID = () => {
    const t = ('000000000000'+new Date().getTime().toString(16)).slice(-12);
    return t.slice(0, 8)+
        '-'+t.slice(-4)+
        '-4'+D()+D()+D()+
        '-'+B()+D()+D()+D()+
        '-'+D()+D()+D()+D()+D()+D()+D()+D()+D()+D()+D()+D();
};

module.exports = { UUID };
