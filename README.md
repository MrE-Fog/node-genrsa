Generates a public/private keypair using `openssl genrsa`.

This module requires OpenSSL to be installed on the system. 


## Usage

```javascript
import keyPair from 'node-genrsa';

const options = {
  bits: 1024,
  exponent: 65537
}
const keys = await keyPair(options);
console.log(keys.private);
console.log(keys.public);
```


## Options

|parameter  |default |description |
|-----------|---------|-------------| 
|bits       |2048     |The size of the private key to generate in bits |
|exponenet  |65537    |The public exponent to use, either 65537 or 3. The default is 65537. |
