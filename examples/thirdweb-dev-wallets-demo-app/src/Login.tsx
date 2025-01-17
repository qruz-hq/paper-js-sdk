import {
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  AuthProvider,
  EmbeddedWalletSdk,
  RecoveryShareManagement,
  SendEmailOtpReturnType,
} from "@thirdweb-dev/wallets";
import React, { useState } from "react";
interface Props {
  thirdwebWallet: EmbeddedWalletSdk | undefined;
  onLoginSuccess: () => void;
}

const loginOptions = [
  {
    authProvider: AuthProvider.GOOGLE,
  },
  {
    authProvider: AuthProvider.FACEBOOK,
  },
  {
    authProvider: AuthProvider.APPLE,
  },
];

const PUBLIC_CLIENT_ENC_KEY = "some-encryption-key";
export const Login: React.FC<Props> = ({ thirdwebWallet, onLoginSuccess }) => {
  const loginWithThirdwebModal = async () => {
    setIsLoading(true);
    try {
      await thirdwebWallet?.auth.loginWithModal();
      onLoginSuccess();
    } catch (e) {
      // use cancelled login flow
    }
    setIsLoading(false);
  };

  const [email, setEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [promptForRecoveryCode, setPromptForRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [sendEmailOtpResult, setSendEmailOtpResult] = useState<
    SendEmailOtpReturnType | undefined
  >(undefined);
  const [sendOtpErrorMessage, setSendOtpErrorMessage] = useState("");
  const [verifyOtpErrorMessage, setVerifyOtpErrorMessage] = useState("");
  const [username, setUsername] = useState("");
  const [expirationTimeUnix, setExpirationTimeUnix] = useState("");
  const [customAuthErrorMessage, setCustomAuthErrorMessage] = useState("");
  const [customJwtErrorMessage, setCustomJwtErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginWithThirdwebEmailOtp = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const result = await thirdwebWallet?.auth.loginWithEmailOtp({
        email: email || "",
      });
      console.log("loginWithThirdwebEmailOtp result", result);
      onLoginSuccess();
    } catch (e) {
      // use closed login modal.
    }
    setIsLoading(false);
  };

  const loginWithOauthHeadless = async (authOption: AuthProvider) => {
    setIsLoading(true);
    try {
      const result = await thirdwebWallet?.auth.loginWithOauth({
        oauthProvider: authOption,
      });
      console.log("loginWithOauth result", result);
      onLoginSuccess();
    } catch (e) {
      console.warn(`Error logging in with Oauth ${authOption}`, e);
    }
    setIsLoading(false);
  };

  const loginWithThirdwebEmailOtpHeadless = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const result = await thirdwebWallet?.auth.sendEmailLoginOtp({
        email: email || "",
      });
      console.log("sendThirdwebEmailLoginOtp result", result);
      setSendEmailOtpResult(result);
    } catch (e) {
      if (e instanceof Error) {
        setSendOtpErrorMessage(`${e.message}. Please try again later.`);
      }
      console.error(
        "Something went wrong sending otp email in headless flow",
        e,
      );
    }
    setIsLoading(false);
  };

  const loginWithCustomJwt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // In production you would do your custom auth here and get a JWT from it
      const jwtResp = await fetch(
        "https://embedded-wallet.thirdweb-dev.com/api/2023-11-30/embedded-wallet/auth/test-sign-jwt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: username,
            email,
          }),
        },
      );
      const jwtJson = await jwtResp.json();
      const jwt: string = jwtJson.jwt;

      const result = await thirdwebWallet?.auth.loginWithCustomJwt({
        encryptionKey: PUBLIC_CLIENT_ENC_KEY,
        jwt,
      });
      console.log("loginWithCustomJwt result", result);
      onLoginSuccess();
    } catch (e) {
      console.error("Something went wrong logging in with custom JWT", e);
      if (e instanceof Error) {
        setCustomJwtErrorMessage(`${e.message}. Please try again later.`);
      }
    }
    setIsLoading(false);
  };

  const loginWithCustomAuthEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await thirdwebWallet?.auth.loginWithCustomAuthEndpoint({
        encryptionKey: PUBLIC_CLIENT_ENC_KEY,
        // In production you would perform your custom auth here and
        // attach a payload that you can use to verify that the user is who they say they are here
        payload: JSON.stringify({
          userId: username,
          ...(email ? { email } : {}),
          ...(expirationTimeUnix ? { exp: parseInt(expirationTimeUnix) } : {}),
        }),
      });
      console.log("loginWithCustomAuthEndpoint result", result);
      onLoginSuccess();
    } catch (e) {
      console.error("Something went wrong logging in with custom auth", e);
      if (e instanceof Error) {
        setCustomAuthErrorMessage(`${e.message}. Please try again later.`);
      }
    }
    setIsLoading(false);
  };

  const finishHeadlessOtpLogin = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const result = await thirdwebWallet?.auth.verifyEmailLoginOtp({
        email: email || "",
        otp: otpCode || "",
        recoveryCode: recoveryCode || undefined,
      });
      console.log("verifyThirdwebEmailLoginOtp result", result);

      onLoginSuccess();
    } catch (e) {
      console.log("error while logging in headless", e);
      if (e instanceof Error) {
        if (e.message.includes("Your OTP code is invalid")) {
          console.error("ERROR verifying otp", e);
          setVerifyOtpErrorMessage(`${(e as any).message}. Please try again`);
        } else if (e.message.includes("Missing recovery code for user")) {
          if (
            sendEmailOtpResult?.recoveryShareManagement ===
            RecoveryShareManagement.USER_MANAGED
          ) {
            setVerifyOtpErrorMessage("");
            setPromptForRecoveryCode(true);
          }
        }
      }
    }
    setIsLoading(false);
  };

  return (
    <Card bg="white" borderRadius={8}>
      <CardBody>
        <Heading size="md">Log in</Heading>
        <Divider my={4} />
        <Button
          colorScheme="purple"
          onClick={loginWithThirdwebModal}
          w="full"
          isLoading={isLoading}
        >
          Login with thirdweb modal
        </Button>

        <Flex my={4} alignItems="center">
          <Divider />
          <Text mx={4}>or</Text>
          <Divider />
        </Flex>
        <Stack as="form">
          <FormControl as={Stack}>
            <Input
              type="email"
              placeholder="you@example.com"
              data-testid="email-otp-modal-input"
              value={email || ""}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </FormControl>
          <Button
            type="submit"
            onClick={loginWithThirdwebEmailOtp}
            disabled={!email}
            isLoading={isLoading}
          >
            Login with Email OTP
          </Button>
        </Stack>

        <Flex my={4} alignItems="center">
          <Divider />
          <Text mx={4}>or</Text>
          <Divider />
        </Flex>
        <Stack gap={5}>
          {loginOptions.map((loginOption) => (
            <Button
              key={loginOption.authProvider}
              w={"full"}
              onClick={() => loginWithOauthHeadless(loginOption.authProvider)}
              isLoading={isLoading}
            >
              Login With {loginOption.authProvider} Directly
            </Button>
          ))}
        </Stack>

        <Flex my={4} alignItems="center">
          <Divider />
          <Text mx={4}>or</Text>
          <Divider />
        </Flex>

        <Stack as="form">
          <FormControl as={Stack} isInvalid={!!customAuthErrorMessage}>
            <Input
              type="text"
              inputMode="text"
              placeholder="c00l-us3rn4m3"
              data-testid="username-custom-auth-endpoint-input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
            <FormErrorMessage>{customAuthErrorMessage}</FormErrorMessage>
          </FormControl>
          <FormControl as={Stack} isInvalid={!!customAuthErrorMessage}>
            <Input
              type="text"
              inputMode="text"
              placeholder="optional you@example.com"
              data-testid="email-custom-auth-endpoint-input"
              value={email ?? ""}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <FormErrorMessage>{customAuthErrorMessage}</FormErrorMessage>
          </FormControl>
          <FormControl as={Stack} isInvalid={!!customAuthErrorMessage}>
            <Input
              type="text"
              inputMode="text"
              placeholder="expiration time in UNIX timestamp"
              data-testid="expiration-custom-auth-endpoint-input"
              value={expirationTimeUnix}
              onChange={(e) => {
                setExpirationTimeUnix(e.target.value);
              }}
            />
            <FormErrorMessage>{customAuthErrorMessage}</FormErrorMessage>
            <FormHelperText>
              Logging in with the same email in social or email auth will error
            </FormHelperText>
          </FormControl>
          <Button
            type="submit"
            onClick={loginWithCustomAuthEndpoint}
            disabled={!username}
            isLoading={isLoading}
          >
            Login with custom auth endpoint
          </Button>
        </Stack>
        <Flex my={4} alignItems="center">
          <Divider />
          <Text mx={4}>or</Text>
          <Divider />
        </Flex>

        <Stack as="form">
          <FormControl as={Stack} isInvalid={!!customJwtErrorMessage}>
            <Input
              type="text"
              inputMode="text"
              placeholder="Your name - Satoshi Nakamoto"
              data-testid="username-jwt-input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
            <FormErrorMessage>{customJwtErrorMessage}</FormErrorMessage>
          </FormControl>
          <FormControl as={Stack} isInvalid={!!customJwtErrorMessage}>
            <Input
              type="text"
              inputMode="text"
              data-testid="email-jwt-input"
              placeholder="you+jwt@example.com"
              value={email ?? ""}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <FormErrorMessage>{customJwtErrorMessage}</FormErrorMessage>
            <FormHelperText>
              Logging in with the same email in social or email auth will error
            </FormHelperText>
          </FormControl>
          <Button
            type="submit"
            onClick={loginWithCustomJwt}
            disabled={!username || !email}
            isLoading={isLoading}
          >
            Login with custom JWT
          </Button>
        </Stack>

        <Flex my={4} alignItems="center">
          <Divider />
          <Text mx={4}>or</Text>
          <Divider />
        </Flex>

        <Stack as="form">
          {sendEmailOtpResult ? (
            <>
              {promptForRecoveryCode ? (
                <>
                  {" "}
                  <FormControl as={Stack} isInvalid={!!verifyOtpErrorMessage}>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Password for your account"
                      value={recoveryCode || ""}
                      onChange={(e) => {
                        setRecoveryCode(e.target.value);
                      }}
                    />
                  </FormControl>
                  <Button
                    type="submit"
                    onClick={finishHeadlessOtpLogin}
                    disabled={!recoveryCode}
                    isLoading={isLoading}
                  >
                    Set password and create account
                  </Button>
                </>
              ) : (
                <>
                  <FormControl as={Stack} isInvalid={!!verifyOtpErrorMessage}>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Otp Code"
                      value={otpCode || ""}
                      onChange={(e) => {
                        setOtpCode(e.target.value);
                      }}
                    />
                    {!!verifyOtpErrorMessage &&
                      !sendEmailOtpResult.isNewDevice && (
                        <FormErrorMessage>
                          {verifyOtpErrorMessage}
                        </FormErrorMessage>
                      )}
                  </FormControl>

                  <Button
                    type="submit"
                    onClick={finishHeadlessOtpLogin}
                    disabled={!email || !otpCode}
                    isLoading={isLoading}
                  >
                    verify headless login OTP
                  </Button>
                  <Button
                    onClick={loginWithThirdwebEmailOtpHeadless}
                    variant="ghost"
                    size="sm"
                  >
                    Request New Code
                  </Button>
                </>
              )}
              <Button
                variant={"ghost"}
                w="fit-content"
                onClick={() => {
                  setOtpCode("");
                  setSendEmailOtpResult(undefined);
                }}
              >
                Back
              </Button>
            </>
          ) : (
            <>
              <FormControl as={Stack} isInvalid={!!sendOtpErrorMessage}>
                <Input
                  type="email"
                  placeholder="you+headless@example.com"
                  data-testid="headless-email-input"
                  value={email || ""}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                />
                {!!sendOtpErrorMessage && (
                  <FormErrorMessage>{sendOtpErrorMessage}</FormErrorMessage>
                )}
              </FormControl>
              <Button
                type="submit"
                onClick={loginWithThirdwebEmailOtpHeadless}
                disabled={!email}
                isLoading={isLoading}
              >
                send headless Email OTP
              </Button>
            </>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};
