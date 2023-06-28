const fs = require('node:fs')
const YAML = require('yaml')

const file = fs.readFileSync('./data.yml', 'utf8');

module.exports = {
  locals: YAML.parse(file),
};
