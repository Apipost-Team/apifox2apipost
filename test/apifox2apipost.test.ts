import Apifox2Apipost from '../src/ApiFox2ApiPost';
let fs = require('fs');
let path = require('path');

describe('works', () => {

  let Apifox2Apipost1=new Apifox2Apipost();
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/apifox2.json'), 'utf-8'));

  it('Apifox2Apipost success', () => {
    expect(Apifox2Apipost1.convert(json).status).toBe('success');
  });

});

