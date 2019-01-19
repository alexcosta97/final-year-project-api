const app = require('../index');
const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;
const mongoose = require('mongoose');
const config = require('config');
const {Company} = require('../models/company.model');
const {Location} = require('../models/location.model');
const {Supplier} = require('../models/supplier.model');
const {Category} = require('../models/category.model');
const {Product} = require('../models/product.model');
const {Subcategory} = require('../models/subcategory.model');
const {Template} = require('../models/template.model');
const {Order} = require('../models/order.model');
const {User} = require('../models/user.model');

let company, location, supplier, category, product, subcategory, template, order, user;
let token;
let input;

describe('Supplier Controller', () => {
    before((done) => {
        mongoose.connect(config.get('mongoConnectionString'), {useNewUrlParser: true, useCreateIndex: true});
        mongoose.connection.once('open', () => {
            mongoose.connection.dropDatabase(() => {
                company = new Company({
                    name: 'Company',
                    email: 'company@testco.com',
                    phone: '12345'
                });
                company.save((err, company) => {
                    location = new Location({
                        name: 'Head Office',
                        phone: company.phone,
                        company: {
                            _id: company._id,
                            name: company.name
                        },
                        address: {
                            houseNumber: '1',
                            street: 'Street',
                            town: 'Town',
                            postCode: 'PC1',
                            country: 'Country'
                        }
                    });
                    location.save((err, location) => {
                        supplier = new Supplier({
                            name: 'Supplier',
                            phone: '12345',
                            email: 'test@supplier.com'
                        });
                        supplier.save((err, supplier) => {
                            category = new Category({
                                name: 'Category',
                                company: {
                                    _id: company._id,
                                    name: company.name
                                }
                            });
                            category.save((err, category) => {
                                product = new Product({
                                    name: 'Product',
                                    price: 10,
                                    quantity: '1*10',
                                    supplierReference: 'SUP-001',
                                    supplier: {
                                        _id: supplier._id,
                                        name: supplier.name
                                    }
                                });
                                product.save((err, product) => {
                                    subcategory = new Subcategory({
                                        name: 'Subcategory',
                                        company: {
                                            _id: company._id,
                                            name: company.name
                                        },
                                        category: {
                                            _id: category._id,
                                            name: category.name
                                        },
                                        products: [{
                                            _id: product._id,
                                            name: product.name,
                                            supplierName: product.supplier.name,
                                            supplierReference: product.supplierReference
                                        }]
                                    });
                                    subcategory.save((err, subcategory) => {
                                        template = new Template({
                                            name: 'Template',
                                            location: {
                                                _id: location._id,
                                                name: location.name
                                            },
                                            company:{
                                                _id: company._id,
                                                name: company.name
                                            },
                                            subcategories: [{
                                                _id: subcategory._id,
                                                name: subcategory.name
                                            }],
                                            orderDays: [Date.now()]
                                        });
                                        template.save((err, template) => {
                                            order = new Order({
                                                location: {
                                                    _id: location._id,
                                                    name: location.name
                                                },
                                                date: Date.now(),
                                                supplier: {
                                                    _id: supplier._id,
                                                    name: supplier.name,
                                                    email: supplier.email
                                                },
                                                productsOrdered: [{
                                                    product: {
                                                        _id: product._id,
                                                        name: product.name,
                                                        price: product.price,
                                                        supplierReference: product.supplierReference
                                                    },
                                                    quantity: 1
                                                }]
                                            });
                                            order.save((err, order) => {
                                                user = new User({
                                                    email: 'testuser@testco.com',
                                                    password: 'Password',
                                                    firstName: 'Test',
                                                    lastName: 'User',
                                                    company: {
                                                        _id: company._id,
                                                        name: company.name
                                                    },
                                                    locations: [{
                                                        _id: location._id,
                                                        name: location.name
                                                    }],
                                                    role: 'Admin'
                                                });
                                                user.save((err, user) => {
                                                    token = user.generateAuthToken();
                                                    input = {
                                                        name: 'Supplier',
                                                        phone: '12345',
                                                        email: 'test@supplier.com'
                                                    };
                                                    done();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    describe('Read all method', () => {
        it('should send an array with all the suppliers in the database', (done) => {
            chai.request(app)
            .get('/api/suppliers/')
            .set('x-auth-token', token)
            .set('Accept', 'application/json')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('array').and.has.lengthOf(1);
                expect(res.body[0]).to.have.property('name', supplier.name);
                expect(res.body[0]).to.have.property('phone', supplier.phone);
                expect(res.body[0]).to.have.property('email', supplier.email);

                done();
            });
        });
    });

    describe('Read single method', () => {
        it('should send an object with the same properties as the ones of the supplier with the given id', (done) => {
            chai.request(app)
            .get(`/api/suppliers/${supplier._id}`)
            .set('Accept', 'application/json')
            .set('x-auth-token', token)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('name', supplier.name);
                expect(res.body).to.have.property('phone', supplier.phone);
                expect(res.body).to.have.property('email', supplier.email);

                done();
            });
        });

        it(`should send an easter egg if the given id isn't in the valid format`, (done) => {
            chai.request(app)
            .get('/api/suppliers/fakeID')
            .set('Accept', 'application/json')
            .set('x-auth-token', token)
            .end((err, res) => {
                expect(res).to.have.status(418);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('message', `I'm a teapot. Don't ask me to brew coffee.`);
                done();
            });
        });

        it(`should send a 404 status code and an error message if there is no supplier with the given ID`, (done) => {
            chai.request(app)
            .get('/api/suppliers/507f1f77bcf86cd799439011')
            .set('Accept', 'application/json')
            .set('x-auth-token', token)
            .end((err, res) => {
                expect(res).to.have.status(404);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('message', 'There was no supplier with the given ID.');

                done();
            });
        });
    });

    describe('Create', () => {
        it('should send back the newly created suppllier if given the right input', (done) => {
            chai.request(app)
            .post('/api/suppliers/')
            .set('x-auth-token', token)
            .send(input)
            .then(res => {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('name', input.name);
                expect(res.body).to.have.property('phone', input.phone);
                expect(res.body).to.have.property('email', input.email);
                done();
            });
        });

        it(`should send a 400 status code and an error message if the given input isn't valid`, (done) => {
            input.email = 'mail';
            chai.request(app)
            .post('/api/suppliers/')
            .set('x-auth-token', token)
            .send(input)
            .then(res => {
                expect(res).to.have.status(400);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('message');
                done();
            });
        });
    });

    describe('Update', () => {
        it(`should update the supplier with the given id`, (done) => {
            input.email = 'mail@supplierco.com';
            chai.request(app)
            .put(`/api/suppliers/${supplier._id}`)
            .set('x-auth-token', token)
            .send(input)
            .then((res => {
                expect(res).to.have.status(200);
                expect(res).to.be.json;

                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('message', 'The operation was successful.');
                done();
            }));
        });

        it(`should send an error message when sending an invalid input`, (done) => {
            input.email = 'mail';
            chai.request(app)
            .put(`/api/suppliers/${supplier._id}`)
            .set('x-auth-token', token)
            .send(input)
            .then(res => {
                expect(res).to.have.status(400);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('message');
                done();
            });
        });

        it(`should send an easter egg when sending an invalid id`, (done) => {
            input.email = 'mail@testco.com';
            chai.request(app)
            .put('/api/suppliers/FakeID')
            .set('x-auth-token', token)
            .send(input)
            .then(res => {
                expect(res).to.have.status(418);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('message', `I'm a teapot. Don't ask me to brew coffee.`);
                done();
            });
        });

        it(`should send an error message if the supplier doesn't exist`, (done) => {
            chai.request(app)
            .put('/api/suppliers/507f1f77bcf86cd799439011')
            .set('x-auth-token', token)
            .send(input)
            .then(res => {
                expect(res).to.have.status(404);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('message', 'There was no supplier with the given ID.');
                done();
            });
        });
    });
});