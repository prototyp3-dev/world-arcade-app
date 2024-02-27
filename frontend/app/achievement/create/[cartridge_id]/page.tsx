import CreateAchievementForm from "@/app/components/CreateAchievementForm";

export default function CreateAchievement({ params }: { params: { cartridge_id: string } }) {
    return (
        <main>
            <section>
                <CreateAchievementForm  cartridge_id={params.cartridge_id} />
            </section>
        </main>
    )
}