export default async function CreateAchievement({ params }: { params: { cartridge_id: string } }) {
    return (
        <main>
            <section>
                Create Achievement for cartridge {params.cartridge_id}
            </section>
        </main>
    )
}