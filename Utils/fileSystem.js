/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-template */
/* eslint-disable no-path-concat */
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');

const uploadProfileImage = async (request) => {
  const data = {};
  const formParse = new formidable.IncomingForm();
  formParse.uploadDir = path.join(__dirname + './../Public/Images/Profile/');
  formParse.keepExtensions = true;
  formParse.maxFieldsSize = 2 * 1024 * 1024;
  return new Promise((resolve, reject) => {
    formParse.onPart = (part) => {
      if (!part.filename || part.filename.match(/\.(jpg|jpeg|png)$/i)) {
        // Let formidable handle the non file-pars and valid file types
        formParse.handlePart(part);
      }
      else {
        // eslint-disable-next-line no-underscore-dangle
        formParse._error('File type is not supported');
      }
    };
    formParse.parse(request)
      .on('field', (name, field) => {
        data[name] = field;
      })
      .on('file', (name, file) => {
        if (file !== null || file.name !== '') {
          const fileName = name + '_' + Date.now() + '.' + file.name.split('.').pop();
          fs.rename(file.path, formParse.uploadDir + fileName, (error) => error);
          data[name] = fileName;
        }
      })
      .on('aborted', () => {
        formParse._error('Request Aborted By User');
      })
      .on('error', (err) => {
        reject(err);
      })
      .on('end', () => {
        resolve(data);
      });
  });
};

const uploadHotelImages = async (request) => {
  const data = {};
  data.filename = [];
  data.amenities_id = [];
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname + './../Public/Images/Hotel/');
  form.keepExtensions = true;
  form.maxFieldsSize = 2 * 1024 * 1024;
  form.multiples = true;

  return new Promise((resolve, reject) => {
    form.onPart = (part) => {
      if (!part.filename || part.filename.match(/\.(jpg|jpeg|png)$/i)) {
        // Let formidable handle the non file-pars and valid file types
        form.handlePart(part);
      }
      else {
        // eslint-disable-next-line no-underscore-dangle
        form._error('File type is not supported');
      }
    };
    form.parse(request)
      .on('field', (name, field) => {
        if (name === 'amenities_id') {
          data.amenities_id.push(field);
        }
        else {
          data[name] = field;
        }
      })
      .on('file', (name, file) => {
        if (file !== null || file.name !== '') {
          const fileName = name + '_' + Date.now() + '.' + file.name.split('.').pop();
          fs.rename(file.path, form.uploadDir + fileName, (error) => error);
          data.filename.push(fileName);
        }
      })
      .on('aborted', () => {
        // eslint-disable-next-line no-underscore-dangle
        form._error('Request Aborted By User');
      })
      .on('error', (err) => {
        reject(err);
      })
      .on('end', () => {
        resolve(data);
      });
  });
};

const uploadHotelRoomImages = async (request) => {
  const data = {};
  data.image = [];
  data.amenities_id = [];
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname + './../Public/Images/Room/');
  form.keepExtensions = true;
  form.maxFieldsSize = 2 * 1024 * 1024;
  form.multiples = true;

  return new Promise((resolve, reject) => {
    form.onPart = (part) => {
      if (!part.filename || part.filename.match(/\.(jpg|jpeg|png)$/i)) {
        // Let formidable handle the non file-pars and valid file types
        form.handlePart(part);
      }
      else {
        // eslint-disable-next-line no-underscore-dangle
        form._error('File type is not supported');
      }
    };
    form.parse(request)
      .on('field', (name, field) => {
        if (name === 'amenities_id') {
          data.amenities_id.push(field);
        }
        else {
          data[name] = field;
        }
      })
      .on('file', (name, file) => {
        if (file !== null || file.name !== '') {
          const fileName = name + '_' + Date.now() + '.' + file.name.split('.').pop();
          fs.rename(file.path, form.uploadDir + fileName, (error) => error);
          data.image.push(fileName);
        }
      })
      .on('aborted', () => {
        // eslint-disable-next-line no-underscore-dangle
        form._error('Request Aborted By User');
      })
      .on('error', (err) => {
        reject(err);
      })
      .on('end', () => {
        resolve(data);
      });
  });
};

const uploadAmenityIcon = async (request) => {
  const data = {};
  const formParse = new formidable.IncomingForm();
  formParse.uploadDir = path.join(__dirname + './../Public/Icons/Amenity/');
  formParse.keepExtensions = true;
  formParse.maxFieldsSize = 1 * 1024 * 1024;
  return new Promise((resolve, reject) => {
    formParse.onPart = (part) => {
      if (!part.filename || part.filename.match(/\.(jpg|jpeg|png)$/i)) {
        // Let formidable handle the non file-pars and valid file types
        formParse.handlePart(part);
      }
      else {
        // eslint-disable-next-line no-underscore-dangle
        formParse._error('File type is not supported');
      }
    };
    formParse.parse(request)
      .on('field', (name, field) => {
        data[name] = field;
      })
      .on('file', (name, file) => {
        if (file !== null || file.name !== '') {
          const fileName = name + '_' + Date.now() + '.' + file.name.split('.').pop();
          fs.rename(file.path, formParse.uploadDir + fileName, (error) => error);
          data[name] = fileName;
        }
      })
      .on('aborted', () => {
        formParse._error('Request Aborted By User');
      })
      .on('error', (err) => {
        reject(err);
      })
      .on('end', () => {
        resolve(data);
      });
  });
};

module.exports = {
  uploadProfileImage,
  uploadHotelImages,
  uploadHotelRoomImages,
  uploadAmenityIcon
};
