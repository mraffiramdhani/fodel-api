const { response } = require('../Utils');

const index = (req, res) => {
  response(res, 200, true, 'Success');
  // new formidable.IncomingForm().parse(req)
  //   .on('field', (name, field) => {
  //     console.log('Field', name, field)
  //   })
  //   .on('file', (name, file) => {
  //     console.log('Uploaded file', name, file)
  //   })
  //   .on('aborted', () => {
  //     console.error('Request aborted by the user')
  //   })
  //   .on('error', (err) => {
  //     console.error('Error', err)
  //     throw err
  //   })
  //   .on('end', () => {
  //     res.end()
  //   })
};

module.exports = {
  index
};
