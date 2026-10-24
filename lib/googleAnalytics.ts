type GoogleAnalyticsEventParameters = Record<
  string,
  string | number | boolean | (() => void)
>;

type GoogleAnalyticsWindow = Window & {
  dataLayer?: IArguments[];
  gtag?: (
    command: "event",
    eventName: string,
    parameters?: GoogleAnalyticsEventParameters,
  ) => void;
};

export function trackGoogleAnalyticsEvent(
  eventName: string,
  parameters?: GoogleAnalyticsEventParameters,
) {
  if (typeof window === "undefined") return false;

  const analyticsWindow = window as GoogleAnalyticsWindow;
  if (analyticsWindow.gtag) {
    analyticsWindow.gtag("event", eventName, parameters);
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `Google Analytics event "${eventName}" was not sent because gtag is unavailable.`,
    );
  }
  return false;
}
