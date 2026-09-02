const fs = require('fs');
const data = fs.readFileSync('./public/cute_robot.glb', 'utf8');
const matches = data.match(/"name":"(.*?)"/g);
console.log(matches.slice(0, 50));
