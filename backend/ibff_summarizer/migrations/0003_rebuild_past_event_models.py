from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ibff_summarizer', '0002_pastevent_pasteventsummary_pasteventmunicipality'),
    ]

    operations = [
        # Drop old tables and recreate with new schema
        migrations.DeleteModel(name='PastEventSummary'),
        migrations.DeleteModel(name='PastEventMunicipality'),
        migrations.DeleteModel(name='PastEvent'),

        migrations.CreateModel(
            name='PastEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_name', models.CharField(max_length=100, unique=True)),
                ('date_start', models.DateField()),
                ('date_end', models.DateField(blank=True, null=True)),
                ('sheet_gids', models.JSONField(default=list)),
                ('total_municipalities', models.IntegerField(default=0)),
                ('confirmed_municipalities', models.IntegerField(default=0)),
                ('last_synced_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['-date_start']},
        ),
        migrations.CreateModel(
            name='PastEventMunicipality',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('province', models.CharField(max_length=200)),
                ('municipality', models.CharField(max_length=200)),
                ('has_flooding_report', models.BooleanField(default=False)),
                ('reference_url', models.TextField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('tab_date', models.DateField(blank=True, null=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='municipalities', to='ibff_summarizer.pastevent')),
            ],
            options={'ordering': ['province', 'municipality']},
        ),
        migrations.CreateModel(
            name='PastEventSummary',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('summary_output', models.JSONField()),
                ('source', models.CharField(choices=[('llm', 'LLM'), ('fallback', 'Fallback')], default='fallback', max_length=20)),
                ('validation_passed', models.BooleanField(default=True)),
                ('generated_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='summary', to='ibff_summarizer.pastevent')),
            ],
        ),
    ]
