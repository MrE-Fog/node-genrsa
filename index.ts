import { exec } from 'child_process';
import { readFile, unlink } from 'fs';
import { tmpdir } from 'os';
import { promisify } from 'util';
import { randomBytes } from 'crypto';

export interface KeyPairOptions {
  bits?: number;
  exponent?: 65537 | 3;
}

export interface KeyPair {
  public: string;
  private: string;
}

const defaultOptions : KeyPairOptions = {
  bits: 2048,
  exponent: 65537,
};

const execPromise = promisify(exec);
const readFilePromise = promisify(readFile);
const unlinkPromise = promisify(unlink);
const tempDir = tmpdir();

const keyPair = async (opts?: KeyPairOptions) : Promise<KeyPair> => {
  const options = {
    ...defaultOptions,
    ...opts,
  };

  if (options.bits < 64) {
    // See: https://wiki.openssl.org/index.php/Manual:Genrsa(1)
    throw new Error('Error: Prime generation algorithm cannot generate small primes. Therefore the number of bits should not be less that 64.');
  }

  const privateName = `${Date.now()}-${randomBytes(8).toString('hex')}`;
  const privateOutputPath = `${tempDir}/${privateName}.pem`;
  const exponentOption = options.exponent === 3 ? '-3' : '-F4';
  const privateCmd = `openssl genrsa ${exponentOption} -out ${privateOutputPath} ${options.bits}`;
  try {
    await execPromise(privateCmd, { cwd: __dirname });
  } catch (e) {
    e.message = `Error: Could not generate private key: ${e.message}`
    throw e;
  }

  const publicName = `${privateName}-pub`;
  const publicOutputPath = `${tempDir}/${publicName}.pem`;
  const publicCmd = `openssl rsa -pubout -in ${privateOutputPath} -out ${publicOutputPath}`;
  try {
    await execPromise(publicCmd, { cwd: __dirname });
  } catch (e) {
    e.message = `Error: Could not calculate public key: ${e.message}`
    throw e;
  }

  const keyPromises = [
    readFilePromise(privateOutputPath, 'utf8'),
    readFilePromise(publicOutputPath, 'utf8'),
  ];

  const keys = await Promise.all(keyPromises);

  const unlinkKeyPromises = [
    unlinkPromise(privateOutputPath),
    unlinkPromise(publicOutputPath),
  ];

  try {
    await Promise.all(unlinkKeyPromises);
  } catch (e) {
    e.message = `Error: Could not unlink temporary key files: ${e.message}`
    throw e;
  }

  return {
    private: keys[0],
    public: keys[1],
  };

};

export default keyPair;
