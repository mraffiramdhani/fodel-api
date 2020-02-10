const { Cart } = require('../Services');
const { response } = require('../Utils');

const getCart = async (req, res) => {
	const { id } = req.auth;
	await Cart.getCart(id).then((result) => {
		if(result.length > 0){
			return response(res, 200, true, 'Data Found.', result);
		}
		else {
			return response(res, 200, true, 'Your Cart Is Empty.');
		}
	}).catch((error) => response(res, 200, false, 'Error At Fetching Cart Data.', error));
};

const addItemToCart = async (req, res) => {
	const { id } = req.auth;
	await Cart.addItemToCart(id, req.body).then(async (result) => {
		const { insertId } = result;
		if (insertId > 0){
			await Cart.getCart(id).then((_result) => {
				if(_result.length > 0) {
					return response(res, 200, true, 'Data Found.', _result);
				}
				else {
					return response(res, 200, false, 'Fetching Cart Data Failed. Please Try Again.');
				}
			}).catch((error) => response(res, 200, false, 'Error At Fetching Cart Data.', error));
		}
		else {
			return response(res, 200, false, 'Adding Item To Cart Failed. Please Try Again.');
		}
	}).catch((error) => response(res, 200, false, 'Error At Adding Item', error));
};

const updateItemInCart = async (req, res) => {
	const { id } = req.auth;
	const { itemId } = req.params;
	await Cart.updateItemInCart(id, itemId, req.body).then(async (result) => {
		const { affectedRows } = result;
		if(affectedRows > 0) {
			await Cart.getCart(id).then((_result) => {
				if(_result.length > 0){
					return response(res, 200, true, 'Data Found.', _result);
				}
				else {
					return response(res, 200, false, 'Fetching Cart Data Failed. Please Try Again');
				}
			}).catch((error) => response(res, 200, false, 'Error At Fetching Cart Data.', error));
		}
		else {
			return response(res, 200, false, 'Updating Item Cart Failed. Please Try Again');
		}
	}).catch((error) => response(res, 200, false, 'Error At Updating Item', error));
};

const deleteItemInCart = async (req, res) => {
	const { id } = req.auth;
	const { itemId } = req.params;
	console.log(req.auth, req.params);
	await Cart.deleteItemInCart(id, itemId).then(async (result) => {
		const { affectedRows } = result;
		if(affectedRows > 0){
			await Cart.getCart(id).then((_result) => {
				if(_result.length > 0){
					return response(res, 200, true, 'Data Found.', _result);
				}
				else {
					return response(res, 200, true, 'Your Cart Is Empty.');
				}
			}).catch((error) => response(res, 200, false, 'Fetching Cart Data Failed. Please Try Again', error));
		}
		else {
			return response(res, 200, false, 'Deleting Cart Item Failed. Please Try Again.');
		}
	}).catch((error) => response(res, 200, false, 'Error At Deleting Cart Item.', error));
};

module.exports = {
	getCart,
	addItemToCart,
	updateItemInCart,
	deleteItemInCart
}
