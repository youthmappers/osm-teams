import { useRouter } from 'next/router'
import { Box, Container, Heading, Text, Button, Code } from '@chakra-ui/react'
import InpageHeader from '../../components/inpage-header'

const errorMessages = {
  Configuration:
    'There is a problem with the server configuration. ' +
    'Check that the required environment variables (NEXTAUTH_SECRET, OSM_TEAMS_CLIENT_ID, OSM_TEAMS_CLIENT_SECRET) are set correctly.',
  AccessDenied: 'Access was denied. You may not have permission to sign in.',
  Verification:
    'The verification link may have expired or has already been used.',
  Default: 'An unexpected error occurred during authentication.',
}

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  const message = errorMessages[error] || errorMessages.Default

  return (
    <Box as='main' mb={8}>
      <InpageHeader>
        <Heading color='white' mb={2}>
          Authentication Error
        </Heading>
      </InpageHeader>
      <Container maxW='container.xl' as='section'>
        <Box layerStyle='shadowed'>
          <Text fontSize='2xl' mb={4}>
            {message}
          </Text>
          {error && (
            <Text mb={4}>
              Error code: <Code>{error}</Code>
            </Text>
          )}
          <Text mb={4}>
            If you are an administrator, check the server logs for more details.
          </Text>
          <Button onClick={() => router.push('/')}>Go to homepage</Button>
        </Box>
      </Container>
    </Box>
  )
}
