const conn = require('./db');

const getCategories = () => {
	const sql = 'SELECT * FROM categories';

	return new Promise((resolve, reject) => {
		conn.query(sql, [], (err, res) => {
			if (err) reject(err);
			resolve(res);
		});
	});
};

const addCategory = (data) => {
	const sql = 'INSERT INTO categories(name) VALUES(?)'
}

module.exports = {
	getCategories
}
