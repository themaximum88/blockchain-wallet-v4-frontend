import Modals from 'modals'
import React from 'react'
import { connect } from 'react-redux'
import { Route } from 'react-router-dom'
import styled from 'styled-components'

import Header from './Header'
import AnalyticsTracker from 'providers/AnalyticsTracker'
import ErrorBoundary from 'providers/ErrorBoundaryProvider'
import { selectors } from 'data'

const Wrapper = styled.div`
  height: auto;
  min-height: 100%;
  width: 100%;
  overflow: auto;

  @media (min-width: 768px) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    height: 100%;
  }
`
const HeaderContainer = styled.div`
  position: relative;
  width: 100%;

  @media (min-width: 768px) {
    top: 0;
    left: 0;
  }
`
const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  margin: 0 25px;

  @media (min-width: 768px) {
    height: 100%;
  }

  @media (min-height: 1000px) {
    height: 100%;
    margin-top: 200px;
    justify-content: flex-start;
  }

  @media (min-height: 1400px) {
    height: 100%;
    margin-top: 500px;
    justify-content: flex-start;
  }
`

class SecurityLayoutContainer extends React.PureComponent {
  render () {
    const { component: Component, ...rest } = this.props
    return (
      <React.Fragment>
        <Route
          {...rest}
          render={matchProps => (
            <Wrapper>
              <AnalyticsTracker />
              <ErrorBoundary>
                <Modals />
                <HeaderContainer>
                  <Header />
                </HeaderContainer>
                <ContentContainer>
                  <Component {...matchProps} />
                </ContentContainer>
              </ErrorBoundary>
            </Wrapper>
          )}
        />
      </React.Fragment>
    )
  }
}

const mapStateToProps = state => ({
  pathname: selectors.router.getPathname(state),
  domainsR: selectors.core.walletOptions.getDomains(state),
  migrationRedirectsR: selectors.core.walletOptions.getMigrationRedirects(state)
})

export default connect(mapStateToProps)(SecurityLayoutContainer)
