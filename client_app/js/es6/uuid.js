const R = Math.random;
function D() { return (R()*16|0).toString(16); }// 0-f
function B() { return (R()*16|0&0x3|0x8).toString(16); } // 8-b
module.exports = function UUID() {
    const t = ('000000000000'+new Date().getTime().toString(16)).slice(-12);
    return t.slice(0, 8)+
        '-'+t.slice(-4)+
        '-4'+D()+D()+D()+
        '-'+B()+D()+D()+D()+
        '-'+D()+D()+D()+D()+D()+D()+D()+D()+D()+D()+D()+D();
}
