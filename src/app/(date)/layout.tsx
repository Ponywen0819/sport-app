import { DateStoreProvider } from "@/providers/date-store-provider";
import { PropsWithChildren } from "react";

const Layout = (props: PropsWithChildren) => {
  const { children } = props;

  return <DateStoreProvider>{children}</DateStoreProvider>;
};

export default Layout;
