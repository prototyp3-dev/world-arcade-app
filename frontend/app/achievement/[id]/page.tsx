export default async function Achievement({ params }: { params: { id: string } }) {
    return (
        <main>
            <section>
                Achievement {params.id}
            </section>
        </main>
    )
}