export default async function GameplaysPage({ params }: { params: { cartridge_id: string } }) {
    return (
        <main>
            <section>
                Gameplays Page {params.cartridge_id}
            </section>
        </main>
    )
}