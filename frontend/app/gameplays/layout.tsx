import { SelectedMomentsProvider } from "../components/SelectedMomentsProvider";
import SelectedMoments from "@/app/components/SelectedMoments";


export default async function AchievementLayout({
    children
  }: {
    children: React.ReactNode
  }) {

    return (
        <SelectedMomentsProvider>
            <SelectedMoments/>
            {children}
        </SelectedMomentsProvider>
    )
  }