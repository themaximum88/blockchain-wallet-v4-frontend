import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Link as RouterLink } from 'react-router-dom'
import styled from 'styled-components'

import { Image, Link } from 'blockchain-info-components'
import { Navbar, NavbarBrand } from 'components/Navbar'

const White = styled.div`
  color: white;

  a:link {
    color: white;
  }

  a:visited {
    color: white;
  }
`

const Dashboard = styled.div`
  padding-right: 25px;
`

const Header = () => {
  return (
    <React.Fragment>
      <White>
        <Navbar height='90px'>
          <NavbarBrand>
            <RouterLink to='/'>
              <Image name='blockchain-vector' height='20px' />
            </RouterLink>
          </NavbarBrand>
          <Dashboard>
            <RouterLink to='/home'>
              <FormattedMessage
                id='layouts.wallet.menuleft.navigation.close'
                defaultMessage='Close'
              />
            </RouterLink>
          </Dashboard>
        </Navbar>
      </White>
    </React.Fragment>
  )
}

export default Header
