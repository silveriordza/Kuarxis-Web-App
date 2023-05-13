import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Image, Navbar, Nav, Container, NavDropdown } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { logout } from '../actions/userActions'
import { useEffect } from 'react'
import {
  KUARSIS_PUBLIC_STATIC_FOLDER,
  KUARSIS_BANNER_MAIN_LOGO,
} from '../constants/enviromentConstants'

const Header = ({ history }) => {
  const dispatch = useDispatch()
  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo, logedout } = userLogin

  useEffect(() => {
    if (logedout) {
      history.push('/')
    }
    // eslint-disable-next-line
  }, [history, logedout])

  const logoutHandler = () => {
    dispatch(logout())
  }

  return (
    <header className='mb-2'>
      <Navbar
        id='mainNavbar'
        bg='dark'
        variant='dark'
        expand='md'
        // fixed='top'
        collapseOnSelect
      >
        <Container>
          <Navbar.Brand href='/'>
            <Image
              src={
                KUARSIS_PUBLIC_STATIC_FOLDER + '/' + KUARSIS_BANNER_MAIN_LOGO
              }
              alt='KuarsisLogoMissing'
              width='50'
              height='50'
              fluid
            />
            <span style={{ marginLeft: '10px' }}>Kuarsis Companies</span>
          </Navbar.Brand>
          {/* Navbar.Toggle is the tag that makes the Hamburger menu button to appear on mobiles, if you remove this line, the hamburger will not show up on mobile devices */}
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse
            id='basic-navbar-nav'
            className='justify-content-start'
          >
            <Nav>
              <NavDropdown title='Vision Mision' id='visionmision'>
                <LinkContainer to='/kuarsistech'>
                  <NavDropdown.Item>Kuarsis Tech</NavDropdown.Item>
                </LinkContainer>
                <LinkContainer to='/kuarsispixan'>
                  <NavDropdown.Item>Kuarsis Pixan</NavDropdown.Item>
                </LinkContainer>
                <LinkContainer to='/kuarsistaanah'>
                  <NavDropdown.Item>Kuarsis Taanah</NavDropdown.Item>
                </LinkContainer>
              </NavDropdown>
            </Nav>
            <Nav>
              <LinkContainer to='/kuarsistech'>
                <Nav.Link>Tech</Nav.Link>
              </LinkContainer>

              <div class='navbar-nav'>
                <a className='nav-link' href='https://pixan.kuarsis.com'>
                  Pixan
                </a>
              </div>

              <LinkContainer to='/kuarsistaanah'>
                <Nav.Link>Taanah</Nav.Link>
              </LinkContainer>
            </Nav>
            <Nav className='me-auto'>
              {userInfo ? (
                <NavDropdown title={userInfo.name.split(' ')[0]} id='username'>
                  <LinkContainer to='/profile'>
                    <NavDropdown.Item>Profile</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Item onClick={logoutHandler}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <>
                  <LinkContainer to='/sign-in'>
                    <Nav.Link>
                      <i className='fas fa-sign-in-alt'></i> Sign In
                    </Nav.Link>
                  </LinkContainer>
                  <LinkContainer to='/sign-up'>
                    <Nav.Link>
                      <i className='fas fa-user-plus'></i> Sign Up
                    </Nav.Link>
                  </LinkContainer>
                </>
              )}
              {userInfo && userInfo.isAdmin && (
                <NavDropdown title='Admin' id='adminmenu'>
                  <LinkContainer to='/admin/userlist'>
                    <NavDropdown.Item>Users</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to='/admin/productlist'>
                    <NavDropdown.Item>Products</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to='/admin/orderlist'>
                    <NavDropdown.Item>Orders</NavDropdown.Item>
                  </LinkContainer>
                </NavDropdown>
              )}
              <LinkContainer to='/cart'>
                <Nav.Link>
                  {' '}
                  <i className='fas fa-shopping-cart'></i> Cart
                </Nav.Link>
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  )
}

export default Header
