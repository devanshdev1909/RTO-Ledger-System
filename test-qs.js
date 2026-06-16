const qs = require('qs');
console.log(qs.parse('permissions[]=1&permissions[]=2'));
console.log(qs.parse('permissions=1&permissions=2'));
