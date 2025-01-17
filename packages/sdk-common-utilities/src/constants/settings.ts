const isDev = (): boolean => {
  return !!(
    typeof window !== "undefined" &&
    window.localStorage.getItem("IS_PAPER_DEV") === "true"
  );
};

const isOldPaperDomain = (): boolean =>
  typeof window !== "undefined" && window.location.origin.includes("paper.xyz");

const isThirdwebDomain = (): boolean =>
  typeof window !== "undefined" &&
  window.location.origin.includes("thirdweb.com");

export const getPaperOriginUrl = (): string => {
  if (isDev())
    return (
      window.localStorage.getItem("PAPER_DEV_URL") ?? "http://localhost:3000"
    );

  if (isOldPaperDomain()) return window.location.origin;
  if (isThirdwebDomain()) return window.location.origin;

  return "https://payments.thirdweb.com";
};
