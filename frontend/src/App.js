import React from 'react'
import { Container } from 'react-bootstrap'
import Header from './components/Header'
import Footer from './components/Footer'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import LoginScreen from './screens/LoginScreen'
import BusinessInformationScreen from './screens/BusinessInformationScreen'
// import UnderConstructionScreen from './screens/UnderConstructionScreen'
import RegisterScreen from './screens/RegisterScreen'
import ProfileScreen from './screens/ProfileScreen'
import ProductsStoreScreen from './screens/ProductsStoreScreen'
import ProductDetailScreen from './screens/ProductDetailScreen'
import CartScreen from './screens/CartScreen'
import ShippingScreen from './screens/ShippingScreen'
import PaymentScreen from './screens/PaymentScreen'
import PlaceOrderScreen from './screens/PlaceOrderScreen'
import OrderScreen from './screens/OrderScreen'
import ProductListAdminScreen from './screens/ProductListAdminScreen'
import ProductEditScreen from './screens/ProductEditScreen'

import dotenv from 'dotenv'

//https://dev.d2zqth0d2er18d.amplifyapp.com
const App = () => {
  dotenv.config()
  return (
    <>
      <Router>
        <Route component={Header} />
        <main>
          <Container>
            <Route path='/profile' component={ProfileScreen} />
            <Route path='/sign-up' component={RegisterScreen} exact />
            <Route path='/sign-in' component={LoginScreen} exact />
            <Route path='/businessinformation' component={BusinessInformationScreen} exact />
            <Route
              path='/productsstore/page/:pageNumber'
              component={ProductsStoreScreen}
              exact
            />
            <Route path='/productsstore' component={ProductsStoreScreen} exact />
            <Route
              path='/admin/productlistadmin'
              component={ProductListAdminScreen}
              exact
            />
            <Route
              path='/admin/productlistadmin/:pageNumber'
              component={ProductListAdminScreen}
              exact
            />
            <Route
              path='/productdetail/:id'
              component={ProductDetailScreen}
            />

            <Route
              path='/admin/product/:id/edit'
              component={ProductEditScreen}
            />
            <Route path='/cart/:id?' component={CartScreen} />
            <Route path='/order/:id' component={OrderScreen} />
            <Route path='/shipping' component={ShippingScreen} />
            <Route path='/payment' component={PaymentScreen} />
            <Route path='/placeorder' component={PlaceOrderScreen} />
            <Route path='/' component={ProductsStoreScreen} exact />
          </Container>
        </main>
        <Footer />
      </Router>
    </>
  )
}

export default App
