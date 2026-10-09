import { Layout } from "../components/Layout";
import { ExchangePayloadCheckerView } from "./ExchangePayloadCheckerView";
import { DEVICE_SIDE_CHECKS_NOTE } from "./logic";
import { useExchangePayloadCheckerViewModel } from "./useExchangePayloadCheckerViewModel";

export function ExchangePayloadChecker() {
  const viewModel = useExchangePayloadCheckerViewModel();

  return (
    <Layout
      title="Exchange Payload Checker"
      description={`Check, without a device, that a Swap (NG or legacy) or Sell NG payload and its partner signature pass the payload and signature checks performed by Ledger Live and the Exchange app. ${DEVICE_SIDE_CHECKS_NOTE}`}
    >
      <ExchangePayloadCheckerView {...viewModel} />
    </Layout>
  );
}
